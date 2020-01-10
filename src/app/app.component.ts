import { Component, OnInit } from '@angular/core';
import { AppService, Distributions } from './app.service';
import * as d3 from 'd3';

const TIERS = ['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'G1', 'G2', 'G3', 'P1', 'P2', 'P3', 'D1', 'D2', 'D3', 'C1', 'C2', 'C3', 'GC'];

class PlaylistPlot {
  visible: boolean;
  color: string;

  line?: d3.line;
  area?: d3.area;
  lineGraph?: d3.Selection;
  areaGraph?: d3.Selection;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  dists: Distributions;
  playlists: { [p: string]: PlaylistPlot } = {
    'Standard': {visible: true, color: '#396ab1'},
    'Doubles': {visible: true, color: '#DA7C30'},
    'Solo Duel': {visible: true, color: '#3E9651'},
    'Solo Standard': {visible: true, color: '#CC2529'},
    'Rumble': {visible: false, color: '#535154'},
    'Dropshot': {visible: false, color: '#6B4C9A'},
    'Hoops': {visible: false, color: '#922428'},
    'Snow Day': {visible: false, color: '#948B3D'},
  };
  playlistsNames = Object.keys(this.playlists);

  seasonsBounds: number[];
  selectedSeason: number;

  svg: d3.Selection;
  width: number;
  height: number;
  y: d3.scale;
  yAxis: d3.axis;

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
      .domain([0, this.getMax()])
      .range([this.height, 0]);

    this.yAxis = d3.axisLeft(this.y);
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(this.yAxis);

    for (const p in this.playlists) {
      const pp = this.playlists[p];

      const xCoord = (d, i) => x(TIERS[i]) + x.step() / 2;
      const yCoord = d => this.y(d);

      pp.area = d3.area()
        .curve(d3.curveLinear)
        .x(xCoord)
        .y0(this.y(0))
        .y1(yCoord);
      pp.line = d3.line()
        .x(xCoord)
        .y(yCoord);

      const season = this.dists[this.selectedSeason][p];

      pp.areaGraph = this.svg.append('path')
        .datum(season)
        .attr('fill', pp.color)
        .attr('opacity', pp.visible ? 0.1 : 0)
        .attr('d', pp.area);

      pp.lineGraph = this.svg.append('path')
        .datum(season)
        .attr('fill', 'none')
        .attr('opacity', pp.visible ? 1 : 0)
        .attr('stroke', pp.color)
        .attr('stroke-width', 1)
        .attr('d', pp.area);
    }
  }

  getMax(): number {
    let max = 10;

    for (const p in this.playlists) {
      if (this.playlists[p].visible && this.dists[this.selectedSeason][p] != undefined) {
        max = d3.max([max, d3.max(this.dists[this.selectedSeason][p])]);
      }
    }

    return max;
  }

  previousSeason() {
    this.selectedSeason = Math.max(this.seasonsBounds[0], this.selectedSeason - 1);
    this.update(true);
  }

  nextSeason() {
    this.selectedSeason = Math.min(this.seasonsBounds[1], this.selectedSeason + 1);
    this.update(true);
  }

  update(changeValues: boolean = false) {
    this.y.domain([0, this.getMax()])
      .range([this.height, 0]);

    const d = changeValues ? 1000 : 250;

    this.svg.selectAll('.y-axis').transition()
      .duration(d)
      .call(this.yAxis);

    for (const p in this.playlists) {
      const pp = this.playlists[p];

      const season = this.dists[this.selectedSeason][p];

      let line = pp.lineGraph;
      let area = pp.areaGraph;

      if (changeValues && season != undefined) {
        line = line.datum(season);
        area = area.datum(season);
      }

      const lineOpacity = season != undefined && pp.visible ? 1 : 0;
      const areaOpacity = season != undefined && pp.visible ? 0.1 : 0;

      line.transition()
        .duration(d)
        .attr('opacity', lineOpacity)
        .attr('d', pp.line);

      area.transition()
        .duration(d)
        .attr('opacity', areaOpacity)
        .attr('d', pp.area);
    }
  }

}
