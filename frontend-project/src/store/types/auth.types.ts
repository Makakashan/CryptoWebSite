export interface User {
	id: number;
	username: string;
	email?: string;
	avatar?: string | null;
	balance?: number;
	role?: string;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface RegisterRequest {
	username: string;
	password: string;
	avatar?: string | null;
}

export interface AuthResponse {
	user: User;
	token?: string;
}
