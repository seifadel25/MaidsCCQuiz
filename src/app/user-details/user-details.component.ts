import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../user.model';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
})
export class UserDetailsComponent implements OnInit {
  user: User | undefined = undefined;
  isLoading = false;
  error: string | undefined;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Consider using type assertion or type guard for stricter type safety
    const id = this.route.snapshot.paramMap.get('id');
    const userId = Number(id);

    this.getUserDetails(userId);
  }

  getUserDetails(id: number) {
    this.isLoading = true;
    this.userService.getUser(id)?.subscribe(
      (response: any) => {
        console.log('Received response:', response);
        this.user = response; // Assuming data exists
        this.isLoading = false;
      },
      (error) => this.handleError(error),
      () => (this.isLoading = false) // Execute on complete
    );
    console.log(this.user); // This might be undefined before subscription completes
  }

  handleError(error: any) {
    console.error('Error fetching user details:', error);
    this.error = 'Failed to load user details.';
  }
}
