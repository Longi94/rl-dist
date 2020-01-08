import { Component, OnInit } from '@angular/core';
import { AppService, Distributions } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  dists: Distributions;

  constructor(private appService: AppService) {
  }

  ngOnInit(): void {
    this.appService.getDistributions().subscribe(dists => {
      this.dists = dists;
    });
  }
}
