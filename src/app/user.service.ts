// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, mergeMap, tap } from 'rxjs/operators';
import { User } from './user.model';

// Define user model (replace with your actual User model structure)
export interface PagedUsersResponse {
  data: User[]; // This matches the API response, which contains the users under 'data'
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// Define interface for PagedUsersResponse
export interface PagedUsersResponse {
  users: User[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  private pageCache: Map<number, PagedUsersResponse> = new Map();

  getUsers(page: number): Observable<PagedUsersResponse> {
    if (this.pageCache.has(page)) {
      const cachedPage = this.pageCache.get(page);
      if (cachedPage !== undefined) {
        // If the page is found in the cache, return it
        return of(cachedPage);
      } else {
        // Handle the unexpected case where the cache entry is undefined
        return throwError(
          () => new Error(`Cached page for page ${page} is undefined.`)
        );
      }
    } else {
      // If not in cache, fetch from the server
      const url = `https://reqres.in/api/users?page=${page}`;
      return this.http.get<PagedUsersResponse>(url).pipe(
        map((response) => {
          // Cache the page response
          this.pageCache.set(page, response);
          return response;
        }),
        catchError((error) =>
          throwError(() => new Error('Error fetching users: ' + error))
        )
      );
    }
  }

  private userCache: Map<number, User> = new Map();

  getUser(id: number): Observable<User> {
    const url = `https://reqres.in/api/users/${id}`;
    // Check if the user is in the cache
    if (this.userCache.has(id)) {
      const cachedUser = this.userCache.get(id);
      if (cachedUser !== undefined) {
        // If the user is found in the cache, return it
        return of(cachedUser);
      } else {
        // Handle the unexpected case where the cache entry is undefined
        return throwError(
          () => new Error(`Cached user with id ${id} is undefined.`)
        );
      }
    } else {
      // If not in cache, fetch from the server
      return this.http.get<{ data: User }>(url).pipe(
        map((response) => {
          const user = response.data;
          // Cache the user
          this.userCache.set(id, user);
          return user;
        }),
        catchError((error) =>
          throwError(() => new Error('Error fetching user: ' + error))
        )
      );
    }
  }

  fetchAllUsers(): Observable<User[]> {
    return this.getUsers(1).pipe(
      mergeMap((initialPage) => {
        // Create an array for all page numbers
        const totalPages = initialPage.total_pages;
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        // Fetch all pages using forkJoin to wait for all requests
        return forkJoin(
          pageNumbers.map((page) =>
            this.getUsers(page).pipe(map((pageData) => pageData.data))
          )
        ).pipe(
          // Flatten the array of arrays into a single array
          map((pages) => pages.flat())
        );
      }),
      catchError((error) =>
        throwError(() => new Error('Error fetching all users: ' + error))
      )
    );
  }
}
