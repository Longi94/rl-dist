import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export declare type RankDistributions = { [rankName: string]: number[] };
export declare type Distributions = { [season: number]: RankDistributions };

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private httpClient: HttpClient) {
  }

  getDistributions(): Observable<Distributions> {
    return this.httpClient.get<Distributions>('assets/distributions.json');
  }
}
