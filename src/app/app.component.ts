import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppService, Distributions} from './app.service';
import * as d3 from 'd3';

const MAX = 0.16;
const LABEL_SIZE = 40;
const MARGIN = {top: 10, right: 30, bottom: 50, left: 60};

class PlaylistPlot {
  visible: boolean;
  color: string;

  line?: d3.line;
  lineGraph?: d3.Selection;
  focus?: d3.Selection;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('chartDiv', {static: true})
  chartDiv: ElementRef;

  dists: Distributions;
  playlists: { [p: string]: PlaylistPlot } = {
    'Standard': {visible: true, color: '#2196F3'},
    'Doubles': {visible: true, color: '#FF9800'},
    'Solo Duel': {visible: true, color: '#4CAF50'},
    'Solo Standard': {visible: true, color: '#F44336'},
    'Rumble': {visible: false, color: '#607D8B'},
    'Dropshot': {visible: false, color: '#9C27B0'},
    'Hoops': {visible: false, color: '#00BCD4'},
    'Snow Day': {visible: false, color: '#FFEB3B'}
  };
  playlistsNames = Object.keys(this.playlists);

  seasonsBounds: number[];
  selectedSeason: number;

  root: d3.Selection;
  svg: d3.Selection;
  width: number;
  height: number;
  y: d3.scaleLinear;
  x: d3.scaleBand;
  yAxis: d3.axisLeft;
  xAxis: d3.axisBottom;

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
    this.width = this.chartDiv.nativeElement.clientWidth - MARGIN.left - MARGIN.right;
    this.height = (this.chartDiv.nativeElement.clientWidth / 3 * 2) - MARGIN.top - MARGIN.bottom;

    this.root = d3.select('#chart')
      .append('svg')
      .attr('width', this.width + MARGIN.left + MARGIN.right)
      .attr('height', this.height + MARGIN.top + MARGIN.bottom);

    this.svg = this.root.append('g')
      .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');


    this.x = d3.scaleBand()
      .domain(this.tiers)
      .range([0, this.width]);

    this.xAxis = d3.axisBottom(this.x);

    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.svg.select('.x-axis').selectAll('text').remove();

    const ticks = this.svg.select('.x-axis').selectAll('.tick')
      .data(this.tiers)
      .append('svg:image')
      .attr('xlink:href', d => d)
      .attr('width', LABEL_SIZE)
      .attr('height', LABEL_SIZE)
      .attr('x', -LABEL_SIZE / 2)
      .attr('y', 10);

    this.y = d3.scaleLinear()
      .domain([0, MAX])
      .range([this.height, 0]);

    this.yAxis = d3.axisLeft(this.y)
      .tickFormat(d3.format('.0%'));

    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(this.yAxis);

    this.svg.select('.y-axis').selectAll('text')
      .attr('font-size', 16);

    for (const p in this.playlists) {
      const pp = this.playlists[p];

      const xCoord = (d, i) => this.x(this.tiers[i]) + this.x.step() / 2;
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
        .attr('stroke-width', 1.5)
        .attr('d', pp.line);

      pp.focus = this.svg.append('circle')
        .style('fill', pp.color)
        .attr('stroke', pp.color)
        .attr('r', 3)
        .style('opacity', 0);
    }

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    this.svg
      .append('rect')
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('width', this.width + MARGIN.left + MARGIN.right)
      .attr('height', this.height + MARGIN.top + MARGIN.bottom)
      .on('mouseover', () => this.mouseover())
      .on('mousemove', (asdf) => {
        this.mousemove();
      })
      .on('mouseout', () => this.mouseout());

    window.addEventListener('resize', () => this.update());
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
    this.width = this.chartDiv.nativeElement.clientWidth - MARGIN.left - MARGIN.right;
    this.height = (this.chartDiv.nativeElement.clientWidth / 3 * 2) - MARGIN.top - MARGIN.bottom;

    const d = changeValues ? 1000 : 250;

    this.root.transition()
      .duration(d)
      .attr('width', this.width + MARGIN.left + MARGIN.right)
      .attr('height', this.height + MARGIN.top + MARGIN.bottom);

    this.x.domain(this.tiers)
      .range([0, this.width]);

    this.y.domain([0, MAX])
      .range([this.height, 0]);

    this.svg.selectAll('.y-axis').transition()
      .duration(d)
      .call(this.yAxis);

    this.svg.selectAll('.x-axis').transition()
      .duration(d)
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

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

  mouseover() {
    for (const p in this.playlists) {
      const pp = this.playlists[p];
      const season = this.dists[this.selectedSeason][p];
      pp.focus.style('opacity', season != undefined && pp.visible ? 1 : 0);
    }
  }

  mousemove() {
    const coords = d3.mouse(this.svg.node());
    const x = coords[0];
    const y = coords[1];

    const step = this.x.step();
    const index = Math.round((x - step / 2) / step);
    const val = this.x.domain()[index];

    if (val == undefined) {
      return;
    }

    let closest: string = undefined;
    let closestD = -1;

    for (const p in this.playlists) {
      const pp = this.playlists[p];
      const season = this.dists[this.selectedSeason][p];

      if (season == undefined) {
        continue;
      }

      const vy = this.y(season[index]);
      pp.focus
        .attr('cx', this.x(val) + step / 2)
        .attr('cy', vy);

      if (pp.visible) {
        const dy = Math.abs(vy - y);
        if (closest == undefined || dy < closestD) {
          closest = p;
          closestD = dy;
        }
      }
    }

    for (const p in this.playlists) {
      const pp = this.playlists[p];
      const season = this.dists[this.selectedSeason][p];

      if (season == undefined || !pp.visible) {
        pp.lineGraph.attr('opacity', 0);
      } else if (p === closest) {
        pp.lineGraph.attr('opacity', 1);
      } else {
        pp.lineGraph.attr('opacity', 0.5);
      }
    }
  }

  mouseout() {
    for (const p in this.playlists) {
      const pp = this.playlists[p];
      const season = this.dists[this.selectedSeason][p];
      pp.focus.style('opacity', 0);
      pp.lineGraph.attr('opacity', season != undefined && pp.visible ? 1 : 0);
    }
  }
}
