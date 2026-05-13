import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForhorInput } from './forhor-input';

describe('ForhorInput', () => {
  let component: ForhorInput;
  let fixture: ComponentFixture<ForhorInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForhorInput],
    }).compileComponents();

    fixture = TestBed.createComponent(ForhorInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
