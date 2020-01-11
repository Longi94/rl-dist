import { Component, OnInit } from '@angular/core';
import { AppService, Distributions } from './app.service';
import * as d3 from 'd3';

const MAX = 0.16;
const LABEL_SIZE = 30;

class PlaylistPlot {
  visible: boolean;
  color: string;

  line?: d3.line;
  lineGraph?: d3.Selection;
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

  tiers: string[] = [];

  constructor(private appService: AppService) {
    for (let i = 1; i <= 19; i++) {
      this.tiers.push(`assets/ranks/${i}.png`);
    }
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
      .domain(this.tiers)
      .range([0, this.width]);

    this.svg.append('g')
      .attr("class", "x-axis")
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(x));

    this.svg.select(".x-axis").selectAll("text").remove();

    const ticks = this.svg.select(".x-axis").selectAll(".tick")
      .data(this.tiers)
      .append("svg:image")
      .attr("xlink:href", d => d)
      .attr("width", LABEL_SIZE)
      .attr("height", LABEL_SIZE)
      .attr("x", -LABEL_SIZE / 2)
      .attr("y", 10);

    this.y = d3.scaleLinear()
      .domain([0, MAX])
      .range([this.height, 0]);

    this.yAxis = d3.axisLeft(this.y)
      .tickFormat(d3.format(".0%"));
    ;
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(this.yAxis);

    for (const p in this.playlists) {
      const pp = this.playlists[p];

      const xCoord = (d, i) => x(this.tiers[i]) + x.step() / 2;
      const yCoord = d => this.y(d);

      pp.line = d3.line()
        .x(xCoord)
        .y(yCoord);

      const season = this.dists[this.selectedSeason][p];

      pp.lineGraph = this.svg.append('path')
        .datum(season)
        .attr('fill', 'none')
        .attr('opacity', pp.visible ? 1 : 0)
        .attr('stroke', pp.color)
        .attr('stroke-width', 1)
        .attr('d', pp.line);
    }
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
    this.y.domain([0, MAX])
      .range([this.height, 0]);

    const d = changeValues ? 1000 : 250;

    this.svg.selectAll('.y-axis').transition()
      .duration(d)
      .call(this.yAxis);

    for (const p in this.playlists) {
      const pp = this.playlists[p];

      const season = this.dists[this.selectedSeason][p];

      let line = pp.lineGraph;

      if (changeValues && season != undefined) {
        line = line.datum(season);
      }

      const lineOpacity = season != undefined && pp.visible ? 1 : 0;

      line.transition()
        .duration(d)
        .attr('opacity', lineOpacity)
        .attr('d', pp.line);
    }
  }

}
