import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'

interface books {
  name: string;
  description: string;
  category: number;
  price: number;
  count: number;
  url: string;
}

@Component({
  selector: 'app-map-test',
  templateUrl: 'map-test.component.html',
  styleUrls: ['./map-test.component.sass']
})

export class MapTestComponent implements OnInit {
  books: books[] = [];
  url = 'http://localhost:8000/book';
  constructor(public http:HttpClient) { }

  ngOnInit(): void {
    this.http.get<books[]>(this.url)
      .subscribe(books => this.books = books)
  }

}
