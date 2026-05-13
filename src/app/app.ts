import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForhorCard } from './components/forhor-card/forhor-card';
import { ForhorInput } from './components/forhor-input/forhor-input';
import { ForhorService } from './forhor.service';
import { Forhor } from './model/forhor';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ForhorCard, ForhorInput],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  private readonly forhorService = inject(ForhorService);
  readonly forhorList = signal<Forhor[] | null>(null);
  readonly loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.forhorService.getAllForhor().subscribe({
      next: (data) => {
        this.forhorList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load förhör:', err);
        this.loading.set(false);
      }
    });
  }
}
