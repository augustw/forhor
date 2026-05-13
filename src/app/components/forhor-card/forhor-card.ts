import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { Forhor } from '../../model/forhor';

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
export class ForhorCard {
  @Input() forhor!: Forhor;

  readonly activeHighlight = signal<string | null>(null);
  readonly expanded = signal(false);
  private readonly maxLines = 5;

  getTextSegments(text: string, highlight: string | null): TextSegment[] {
    if (!highlight || !text) {
      return [{ text, highlighted: false }];
    }

    const escaped = highlight.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const splitPattern = new RegExp(`(${escaped})`, 'gi');
    const matchPattern = new RegExp(escaped, 'i');

    return text.split(splitPattern).filter(Boolean).map((part) => ({
      text: part,
      highlighted: matchPattern.test(part),
    }));
  }

  getVisibleText(text: string): string {
    if (this.expanded() || !this.hasMoreThanMaxLines(text)) {
      return text;
    }

    const lines = text.split(/\r?\n/);
    return lines.slice(0, this.maxLines).join('\n');
  }

  hasMoreThanMaxLines(text: string): boolean {
    return text.split(/\r?\n/).length > this.maxLines;
  }

  toggleExpanded() {
    this.expanded.set(!this.expanded());
  }

  setActiveHighlight(highlight: string | null) {
    this.activeHighlight.set(highlight);
  }

  isHighlightActive(highlight: string) {
    return this.activeHighlight() === highlight;
  }

  getHighlightForCard(): string | null {
    return this.activeHighlight();
  }
}

