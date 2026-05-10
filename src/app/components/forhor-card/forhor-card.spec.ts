import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForhorCard } from './forhor-card';

describe('ForhorCard', () => {
  let component: ForhorCard;
  let fixture: ComponentFixture<ForhorCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForhorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ForhorCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
