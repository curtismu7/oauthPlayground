/**
 * Angular Templates
 * Service-based architecture with RxJS
 */

export class AngularTemplates {
	static authorization(config: any): string {
		return `// Angular - Authorization Service
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * OAuth 2.0 Authorization Service
 * Angular service with RxJS observables
 */

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null
  });

  public authState$ = this.authState.asObservable();

  private config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    redirectUri: '${config.redirectUri}',
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=/g, '');
  }

  async login(): Promise<void> {
    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateCodeVerifier();

      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      const authUrl = new URL(\`https://auth.pingone.com/\${this.config.environmentId}/as/authorize\`);
      authUrl.searchParams.append('client_id', this.config.clientId);
      authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', 'openid profile email');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('state', state);

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  logout(): void {
    this.authState.next({
      isAuthenticated: false,
      user: null
    });
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  private checkAuthStatus(): void {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      this.authState.next({
        isAuthenticated: true,
        user: {} // Decode token to get user info
      });
    }
  }
}

// Component usage
// login.component.ts
import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  template: \`
    <button (click)="login()" class="login-btn">
      Login with PingOne
    </button>
  \`
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  login(): void {
    this.authService.login();
  }
}`;
	}

	static workerToken(config: any): string {
		return `// Angular - Worker Token Service
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

/**
 * Worker Token Service
 * WARNING: This should be done on backend!
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerTokenService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  private config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    clientSecret: 'YOUR_CLIENT_SECRET', // Never expose in frontend!
  };

  constructor(private http: HttpClient) {}

  getWorkerToken(): Observable<string> {
    const url = \`https://auth.pingone.com/\${this.config.environmentId}/as/token\`;
    
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<TokenResponse>(url, body.toString(), { headers }).pipe(
      map(response => {
        this.tokenSubject.next(response.access_token);
        return response.access_token;
      }),
      catchError(error => {
        console.error('Failed to get worker token:', error);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }
}

// Component usage
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-token-display',
  template: \`
    <div *ngIf="token$ | async as token; else loading">
      <h3>Worker Token</h3>
      <code>{{ token.substring(0, 20) }}...</code>
    </div>
    <ng-template #loading>
      <div>Loading token...</div>
    </ng-template>
  \`
})
export class TokenDisplayComponent implements OnInit {
  token$!: Observable<string>;

  constructor(private tokenService: WorkerTokenService) {}

  ngOnInit(): void {
    this.token$ = this.tokenService.getWorkerToken();
  }
}`;
	}

	static deviceSelection(config: any): string {
		return `// Angular - MFA Device Service
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * MFA Device Management Service
 */

export interface MFADevice {
  id: string;
  type: string;
  name: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class MFADeviceService {
  private config = {
    environmentId: '${config.environmentId}',
  };

  constructor(private http: HttpClient) {}

  listDevices(userId: string, accessToken: string): Observable<MFADevice[]> {
    const url = \`/pingone-api/v1/environments/\${this.config.environmentId}/users/\${userId}/devices\`;
    
    const headers = new HttpHeaders({
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => response._embedded?.devices || []),
      catchError(error => {
        console.error('Failed to list devices:', error);
        return throwError(() => error);
      })
    );
  }
}

// Component
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-device-list',
  template: \`
    <div class="device-list">
      <h3>Select MFA Device</h3>
      <div *ngIf="loading">Loading devices...</div>
      <div *ngIf="error" class="error">{{ error }}</div>
      <div *ngFor="let device of devices" 
           class="device-item"
           (click)="selectDevice(device.id)">
        <span class="device-type">{{ device.type }}</span>
        <span class="device-name">{{ device.name }}</span>
        <span class="device-status">{{ device.status }}</span>
      </div>
    </div>
  \`
})
export class DeviceListComponent implements OnInit {
  @Input() userId!: string;
  @Input() accessToken!: string;
  @Output() deviceSelected = new EventEmitter<string>();

  devices: MFADevice[] = [];
  loading = true;
  error: string | null = null;

  constructor(private deviceService: MFADeviceService) {}

  ngOnInit(): void {
    this.deviceService.listDevices(this.userId, this.accessToken).subscribe({
      next: (devices) => {
        this.devices = devices;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  selectDevice(deviceId: string): void {
    this.deviceSelected.emit(deviceId);
  }
}`;
	}

	static mfaChallenge(config: any): string {
		return `// Angular - MFA Challenge Service
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * MFA Challenge Service
 */

interface ChallengeResponse {
  id: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MFAChallengeService {
  private config = {
    environmentId: '${config.environmentId}',
  };

  constructor(private http: HttpClient) {}

  sendChallenge(
    userId: string,
    deviceId: string,
    accessToken: string
  ): Observable<ChallengeResponse> {
    const url = \`/pingone-api/v1/environments/\${this.config.environmentId}/users/\${userId}/devices/\${deviceId}/otp\`;
    
    const headers = new HttpHeaders({
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    });

    return this.http.post<ChallengeResponse>(url, {}, { headers }).pipe(
      catchError(error => {
        console.error('Failed to send challenge:', error);
        return throwError(() => error);
      })
    );
  }
}

// Component
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mfa-challenge',
  template: \`
    <div class="mfa-challenge">
      <h3>MFA Challenge</h3>
      <button 
        (click)="sendChallenge()"
        [disabled]="loading || sent"
        class="send-challenge-btn">
        {{ sent ? 'Code Sent!' : loading ? 'Sending...' : 'Send Code' }}
      </button>
      <div *ngIf="sent" class="success">
        ✓ Challenge code sent! Check your device.
      </div>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  \`
})
export class MFAChallengeComponent {
  @Input() userId!: string;
  @Input() deviceId!: string;
  @Input() accessToken!: string;

  loading = false;
  sent = false;
  error: string | null = null;

  constructor(private challengeService: MFAChallengeService) {}

  sendChallenge(): void {
    this.loading = true;
    this.error = null;

    this.challengeService.sendChallenge(
      this.userId,
      this.deviceId,
      this.accessToken
    ).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}`;
	}

	static mfaVerification(config: any): string {
		return `// Angular - MFA Verification Service
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * MFA Verification Service
 */

interface VerificationResponse {
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class MFAVerificationService {
  private config = {
    environmentId: '${config.environmentId}',
  };

  constructor(private http: HttpClient) {}

  verifyCode(
    userId: string,
    deviceId: string,
    otp: string,
    accessToken: string
  ): Observable<boolean> {
    const url = \`/pingone-api/v1/environments/\${this.config.environmentId}/users/\${userId}/devices/\${deviceId}/otp/verify\`;
    
    const headers = new HttpHeaders({
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    });

    return this.http.post<VerificationResponse>(url, { otp }, { headers }).pipe(
      map(response => response.status === 'VERIFIED'),
      catchError(error => {
        console.error('Verification failed:', error);
        return throwError(() => error);
      })
    );
  }
}

// Component
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-mfa-verification',
  template: \`
    <div class="mfa-verification">
      <h3>Enter Verification Code</h3>
      <form [formGroup]="verificationForm" (ngSubmit)="verifyCode()">
        <input
          type="text"
          formControlName="code"
          placeholder="Enter 6-digit code"
          maxlength="6"
          pattern="[0-9]{6}"
          class="code-input"
        />
        <button
          type="submit"
          [disabled]="loading || !verificationForm.valid"
          class="verify-btn">
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </form>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  \`
})
export class MFAVerificationComponent {
  @Input() userId!: string;
  @Input() deviceId!: string;
  @Input() accessToken!: string;
  @Output() verificationComplete = new EventEmitter<boolean>();

  verificationForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private verificationService: MFAVerificationService
  ) {
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('[0-9]{6}')]]
    });
  }

  verifyCode(): void {
    if (!this.verificationForm.valid) return;

    this.loading = true;
    this.error = null;

    const code = this.verificationForm.value.code;

    this.verificationService.verifyCode(
      this.userId,
      this.deviceId,
      code,
      this.accessToken
    ).subscribe({
      next: (verified) => {
        if (verified) {
          this.verificationComplete.emit(true);
        } else {
          this.error = 'Invalid code. Please try again.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}`;
	}

	static deviceRegistration(config: any): string {
		return `// Angular - Device Registration Service
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Device Registration Service
 */

export type DeviceType = 'SMS' | 'EMAIL' | 'TOTP';

export interface DeviceRegistrationRequest {
  type: DeviceType;
  name?: string;
  phone?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceRegistrationService {
  private config = {
    environmentId: '${config.environmentId}',
  };

  constructor(private http: HttpClient) {}

  registerDevice(
    userId: string,
    request: DeviceRegistrationRequest,
    accessToken: string
  ): Observable<any> {
    const url = \`/pingone-api/v1/environments/\${this.config.environmentId}/users/\${userId}/devices\`;
    
    const headers = new HttpHeaders({
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json'
    });

    const payload: any = {
      type: request.type,
      name: request.name || \`My \${request.type} Device\`,
    };

    if (request.type === 'SMS' && request.phone) {
      payload.phone = request.phone;
    } else if (request.type === 'EMAIL' && request.email) {
      payload.email = request.email;
    }

    return this.http.post(url, payload, { headers }).pipe(
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }
}

// Component
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-device-registration',
  template: \`
    <div class="device-registration">
      <h3>Register MFA Device</h3>
      <form [formGroup]="registrationForm" (ngSubmit)="registerDevice()">
        <div class="form-group">
          <label htmlFor="devicetype">Device Type</label>
          <select formControlName="type" (change)="onTypeChange()">
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
            <option value="TOTP">Authenticator App</option>
          </select>
        </div>

        <div class="form-group">
          <label htmlFor="devicename">Device Name</label>
          <input type="text" formControlName="name" placeholder="My Device" />
        </div>

        <div class="form-group" *ngIf="registrationForm.value.type === 'SMS'">
          <label htmlFor="phonenumber">Phone Number</label>
          <input
            type="tel"
            formControlName="phone"
            placeholder="+1234567890"
          />
        </div>

        <div class="form-group" *ngIf="registrationForm.value.type === 'EMAIL'">
          <label htmlFor="emailaddress">Email Address</label>
          <input
            type="email"
            formControlName="email"
            placeholder="user@example.com"
          />
        </div>

        <button
          type="submit"
          [disabled]="loading || !registrationForm.valid"
          class="register-btn">
          {{ loading ? 'Registering...' : 'Register Device' }}
        </button>
      </form>
      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  \`
})
export class DeviceRegistrationComponent {
  @Input() userId!: string;
  @Input() accessToken!: string;
  @Output() registrationComplete = new EventEmitter<any>();

  registrationForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private registrationService: DeviceRegistrationService
  ) {
    this.registrationForm = this.fb.group({
      type: ['SMS', Validators.required],
      name: [''],
      phone: [''],
      email: ['']
    });
  }

  onTypeChange(): void {
    const type = this.registrationForm.value.type;
    
    // Update validators based on type
    if (type === 'SMS') {
      this.registrationForm.get('phone')?.setValidators([Validators.required]);
      this.registrationForm.get('email')?.clearValidators();
    } else if (type === 'EMAIL') {
      this.registrationForm.get('email')?.setValidators([Validators.required, Validators.email]);
      this.registrationForm.get('phone')?.clearValidators();
    } else {
      this.registrationForm.get('phone')?.clearValidators();
      this.registrationForm.get('email')?.clearValidators();
    }
    
    this.registrationForm.get('phone')?.updateValueAndValidity();
    this.registrationForm.get('email')?.updateValueAndValidity();
  }

  registerDevice(): void {
    if (!this.registrationForm.valid) return;

    this.loading = true;
    this.error = null;

    this.registrationService.registerDevice(
      this.userId,
      this.registrationForm.value,
      this.accessToken
    ).subscribe({
      next: (device) => {
        this.registrationComplete.emit(device);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}`;
	}
}
