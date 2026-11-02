import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import {Alerts} from './features/alerts/alerts';
import { SiteDetail } from './features/site-detail/site-detail';
import { Recommendations } from './features/recommendations/recommendations';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'alerts', component: Alerts },
  { path: 'site/:id', component: SiteDetail },
  { path: 'recommendations', component: Recommendations },
];