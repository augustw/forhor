import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { ForhorService } from '../../forhor.service';

interface TextSegment {
  text: string;
  highlighted: boolean;
}

@Component({
  selector: 'app-forhor-card',
  imports: [CommonModule, MatCardModule, MatBadgeModule, MatChipsModule],
  templateUrl: './forhor-card.html',
  styleUrl: './forhor-card.scss',
})
export class ForhorCard implements OnInit {
  private readonly forhorService = inject(ForhorService);

  readonly result = signal<{ text?: string; highlights?: string[] } | null>(null);
  readonly loading = signal(false);
  readonly activeHighlight = signal<string | null>(null);

  readonly textSegments = computed<TextSegment[]>(() => {
    const res = this.result();
    const highlight = this.activeHighlight();
    const text = res?.text ?? '';

    if (!highlight || !text) {
      return [{ text, highlighted: false }];
    }

    const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const splitPattern = new RegExp(`(${escaped})`, 'gi');
    const matchPattern = new RegExp(escaped, 'i');

    return text.split(splitPattern).filter(Boolean).map((part) => ({
      text: part,
      highlighted: matchPattern.test(part),
    }));
  });

  ngOnInit() {
    this.loading.set(true);
    this.forhorService.getForhor('Förhörstext').subscribe({
      next: (data) => {
        this.result.set(data as { text?: string; highlights?: string[] });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching forhor:', err);
        this.loading.set(false);
      }
    });
  }
}

