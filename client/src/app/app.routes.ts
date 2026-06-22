import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { Create as UserCreate } from './features/users/create/create';
import { List as UserList } from './features/users/list/list';
import { AdminLayout } from './shared/admin-layout/admin-layout';
import { Details as RepoDetails } from './features/repositories/details/details';
import { Create as RepoCreate } from './features/repositories/create/create';
import { List as RepoList } from './features/repositories/list/list';
import { DEVDashboard } from './features/developer/dashboard/dashboard'; 
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';



export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'users/create',
        component: UserCreate
      },
      {
        path: 'users',
        component: UserList
      },
      {
        path: 'repositories/create',
        component: RepoCreate
      },
      {
        path: 'repositories/:id',
        component: RepoDetails
      },
      {
        path: 'repositories',
        component: RepoList
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'admin-dashboard',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'developer/dashboard',
    component: DEVDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['sr-dev', 'jr-dev'] }
  }
];
