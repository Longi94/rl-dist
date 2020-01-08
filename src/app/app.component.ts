import { Component, OnInit } from '@angular/core';
import { AppService, Distributions } from './app.service';
import * as d3 from 'd3';

const TIERS = ['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'G1', 'G2', 'G3', 'P1', 'P2', 'P3', 'D1', 'D2', 'D3', 'C1', 'C2', 'C3', 'GC'];

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
      this.initD3();
    });
  }

  private initD3() {
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleBand()
      .domain(TIERS)
      .range([0, width]);

    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.dists[12]['Solo Duel'])])
      .range([height, 0]);

    svg.append('g')
      .call(d3.axisLeft(y));

    const xCoord = (d, i) => x(TIERS[i]) + x.step() / 2;
    const yCoord = d => y(d);

    const area = d3.area()
      .curve(d3.curveLinear)
      .x(xCoord)
      .y0(y(0))
      .y1(yCoord);

    svg.append('path')
      .datum(this.dists[12]['Solo Duel'])
      .attr('fill', 'steelblue')
      .attr('opacity', '0.3 ')
      .attr('d', area);

    svg.append('path')
      .datum(this.dists[12]['Solo Duel'])
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1)
      .attr('d', d3.line()
        .x(xCoord)
        .y(yCoord)
      );
  }
}
