import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCoachComponent } from './form-coach.component';

describe('FormCoachComponent', () => {
  let component: FormCoachComponent;
  let fixture: ComponentFixture<FormCoachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCoachComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
