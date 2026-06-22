import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list',
  imports: [RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List {
  repositories = [
    {
      id: 1,
      name: 'Student Cover Page Maker',
      stack: 'MERN',
      status: 'Completed'
    },
    {
      id: 2,
      name: 'LMS',
      stack: 'Angular + Laravel',
      status: 'Scanning'
    }
  ];
}
