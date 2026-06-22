import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DEVDashboard } from './dashboard';

describe('Dashboard', () => {
  let component: DEVDashboard;
  let fixture: ComponentFixture<DEVDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DEVDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(DEVDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
