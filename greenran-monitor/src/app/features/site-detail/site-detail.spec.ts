import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SiteDetail } from './site-detail';

describe('SiteDetail', () => {
  let component: SiteDetail;
  let fixture: ComponentFixture<SiteDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
