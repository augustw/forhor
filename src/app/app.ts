import { Component } from '@angular/core';
import { ForhorCard } from './components/forhor-card/forhor-card';

@Component({
  selector: 'app-root',
  imports: [ForhorCard],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
