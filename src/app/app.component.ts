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

  seasonsBounds: number[];
  selectedSeason: number;

  svg;
  width: number;
  height: number;
  y;
  yAxis;
  line;
  area;
  lineGraph;
  areaGraph;

  constructor(private appService: AppService) {
  }

  ngOnInit(): void {
    this.appService.getDistributions().subscribe(dists => {
      this.dists = dists;

      const seasons = Object.keys(this.dists).map(s => parseInt(s));
      seasons.sort((a, b) => a - b);
      this.seasonsBounds = [seasons[0], seasons[seasons.length - 1]];
      this.selectedSeason = this.seasonsBounds[1];

      this.initD3();
    });
  }

  private initD3() {
    const margin = {top: 10, right: 30, bottom: 30, left: 60};
    this.width = 600 - margin.left - margin.right;
    this.height = 400 - margin.top - margin.bottom;

    this.svg = d3.select('#chart')
      .append('svg')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleBand()
      .domain(TIERS)
      .range([0, this.width]);

    this.svg.append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(x));

    this.y = d3.scaleLinear()
      .domain([0, d3.max(this.dists[this.selectedSeason]['Solo Duel'])])
      .range([this.height, 0]);

    this.yAxis = d3.axisLeft(this.y);
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(this.yAxis);

    const xCoord = (d, i) => x(TIERS[i]) + x.step() / 2;
    const yCoord = d => this.y(d);

    this.area = d3.area()
      .curve(d3.curveLinear)
      .x(xCoord)
      .y0(this.y(0))
      .y1(yCoord);
    this.line = d3.line()
      .x(xCoord)
      .y(yCoord);

    const season = this.dists[this.selectedSeason]['Solo Duel'];

    this.areaGraph = this.svg.append('path')
      .datum(season)
      .attr('fill', 'steelblue')
      .attr('opacity', '0.3 ')
      .attr('d', this.area);

    this.lineGraph = this.svg.append('path')
      .datum(season)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1)
      .attr('d', this.area);
  }

  previousSeason() {
    this.selectedSeason = Math.max(this.seasonsBounds[0], this.selectedSeason - 1);
    this.update();
  }

  nextSeason() {
    this.selectedSeason = Math.min(this.seasonsBounds[1], this.selectedSeason + 1);
    this.update();
  }

  update() {
    const season = this.dists[this.selectedSeason]['Solo Duel'];

    this.y.domain([0, d3.max(season)])
      .range([this.height, 0]);

    this.svg.selectAll('.y-axis').transition()
      .duration(1000)
      .call(this.yAxis);

    this.areaGraph
      .datum(season)
      .transition()
      .duration(1000)
      .attr('d', this.area);

    this.lineGraph
      .datum(season)
      .transition()
      .duration(1000)
      .attr('d', this.line);
  }

}
