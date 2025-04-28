# AngularMfaDemo

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.11.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


// Structure recommandée pour le projet Angular MFA

// 1. Création du projet
// ng new angular-mfa-demo --routing

// 2. Installation des dépendances
// npm install bootstrap @ng-bootstrap/ng-bootstrap @fortawesome/fontawesome-free

// Structure des dossiers et fichiers principaux:

// src/app/
// ├── auth/
// │   ├── login/
// │   │   ├── login.component.ts
// │   │   ├── login.component.html
// │   │   └── login.component.scss
// │   ├── mfa-verification/
// │   │   ├── mfa-verification.component.ts
// │   │   ├── mfa-verification.component.html
// │   │   └── mfa-verification.component.scss
// │   ├── mfa-setup/
// │   │   ├── mfa-setup.component.ts
// │   │   ├── mfa-setup.component.html
// │   │   └── mfa-setup.component.scss
// │   ├── account-security/
// │   │   ├── account-security.component.ts
// │   │   ├── account-security.component.html
// │   │   └── account-security.component.scss
// │   ├── models/
// │   │   ├── user.model.ts
// │   │   └── auth.model.ts
// │   └── services/
// │       ├── auth.service.ts
// │       └── mfa.service.ts
// ├── shared/
// │   ├── components/
// │   │   ├── header/
// │   │   └── footer/
// │   └── directives/
// │       └── digit-only.directive.ts
// ├── dashboard/
// │   ├── dashboard.component.ts
// │   ├── dashboard.component.html
// │   └── dashboard.component.scss
// ├── app-routing.module.ts
// ├── app.component.ts
// ├── app.component.html
// ├── app.module.ts
// └── app.component.scss
