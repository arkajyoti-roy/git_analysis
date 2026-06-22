import { Component } from '@angular/core';
import { Create } from '../create/create';

@Component({
  selector: 'app-list',
  imports: [Create],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List {
  users = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@test.com',
    role: 'Admin'
  },
  {
    id: 2,
    name: 'John',
    email: 'john@test.com',
    role: 'Senior Developer'
  }
];
}
