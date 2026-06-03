import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chunk, ForhorService } from '../../forhor.service';

@Component({
  selector: 'app-forhor-input',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './forhor-input.html',
  styleUrl: './forhor-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForhorInput {
  promptControl = new FormControl<string>('');
  loading = signal(false);
  bestChunks = signal<Chunk[]>([]);

  constructor(public forhorService: ForhorService) {}

  onSubmit() {
    const prompt = this.promptControl.value?.trim();
    if (!prompt) return;

    this.loading.set(true);
    this.forhorService.searchChunks(prompt).subscribe({
      next: (data) => {
        // Keep the chunks as returned (may include forhor_id, chunk_index, etc.)
        this.bestChunks.set(data as unknown as Chunk[]);
        this.promptControl.reset();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading.set(false);
      },
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
