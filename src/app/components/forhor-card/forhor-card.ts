import { Component, Input, signal, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { Forhor } from '../../model/forhor';
import { ForhorService } from '../../forhor.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface TextSegment {
  text: string;
  highlighted: boolean;
}

@Component({
  selector: 'app-forhor-card',
  imports: [CommonModule, MatCardModule, MatBadgeModule, MatChipsModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './forhor-card.html',
  styleUrl: './forhor-card.scss',
})
export class ForhorCard {
  @Input() forhor!: Forhor;
  readonly activeHighlight = signal<string | null>(null);
  readonly expanded = signal(false);
  private readonly maxLines = 5;
  private readonly forhorService = inject(ForhorService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private hoverSub: Subscription | null = null;
  snackbar = inject(MatSnackBar);

  ngOnInit(): void {
    this.hoverSub = this.forhorService.hoverChunk$.subscribe((h) => {
      if (!h) {
        this.setActiveHighlight(null);
        return;
      }

      if (!this.forhor) return;

      const hoveredForhorId = (h as any).forhorId ?? (h as any).forhor_id;
      const hoveredChunkText = (h as any).chunk ?? (h as any).text;

      if (hoveredForhorId === this.forhor.id) {
        // If the chunk is not visible in the truncated view, expand
        const visible = this.getVisibleText(this.forhor.text || '');
        const contains = hoveredChunkText ? visible.includes(hoveredChunkText) : false;
        if (!contains && this.hasMoreThanMaxLines(this.forhor.text || '')) {
          this.expanded.set(true);
        }
        this.setActiveHighlight(hoveredChunkText ?? null);
        this.scrollHighlightedIntoView();
      } else {
        // If hovering a chunk for another card, clear highlight here
        this.setActiveHighlight(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.hoverSub?.unsubscribe();
  }

  async getSammanfattning() {
    const sammanfattning = await this.forhorService.getSammanfattning(this.forhor.id);
    this.snackbar.open(sammanfattning, 'Stäng');
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      const highlighted = this.host.nativeElement.querySelector('.highlighted') as HTMLElement | null;
      if (!highlighted) {
        return;
      }

      try {
        highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        highlighted.scrollIntoView();
      }
    }, 50);
  }

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

