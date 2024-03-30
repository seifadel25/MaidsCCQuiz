import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../user.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

interface PagedUsersResponse {
  data: User[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  currentPage = 1;
  isLoading = false;
  totalUsers = 0;
  totalPages = 0;
  pageSize = 0;
  allData: User[] = [];
  filteredData: User[] = [];
  searchTerm: string = '';
  searchTerms = new Subject<string>();
  allUsers: User[] = [];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.getUsers(this.currentPage);
    this.fetchAllUsers();

    this.searchTerms
      .pipe(
        debounceTime(300), // Adjust the debounce time as needed
        distinctUntilChanged(),
        map((searchTerm) => {
          if (!searchTerm) {
            return this.filteredData; // Or return []; if you want an empty list when there's no search term
          }
          const searchTermNumber = Number(searchTerm);
          return isNaN(searchTermNumber)
            ? []
            : this.allUsers.filter((user) => user.id === searchTermNumber);
        })
      )
      .subscribe((filteredData) => {
        this.filteredData = filteredData;
      });
  }
  fetchAllUsers(): void {
    this.isLoading = true;
    this.userService.fetchAllUsers().subscribe(
      (users) => {
        this.allUsers = users;
        this.filteredData = [];
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching all users:', error);
        this.isLoading = false;
      }
    );
  }
  getUsers(page: number) {
    this.isLoading = true;
    this.userService.getUsers(page).subscribe(
      (response: PagedUsersResponse) => {
        this.allData = response.data;
        this.users = response.data;
        this.filteredData = []; // Initially display all data
        this.totalUsers = response.total;
        this.totalPages = response.total_pages;
        this.currentPage = response.page;
        this.pageSize = response.per_page;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch() {
    if (this.searchTerm) {
      const searchTermNumber = Number(this.searchTerm);
      this.filteredData = this.allUsers.filter(
        (user) => user.id === searchTermNumber
      );
    } else {
      // If searchTerm is empty, possibly reset filteredData or handle as needed
      this.filteredData = [];
    }
  }

  search(event: Event): void {
    const target = event.target as HTMLInputElement; // Cast to HTMLInputElement
    const value = target.value;
    this.searchTerms.next(value);
  }

  selectUser(user: User): void {
    this.router.navigate(['/user', user.id]);
  }
  onPaginate(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.getUsers(this.currentPage);
    // this.searchTerm = '';
    this.onSearch();
  }
}
