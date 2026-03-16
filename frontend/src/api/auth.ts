const API_URL = "/api/auth";

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    role: string;
    children?: { name: string; birthDate?: string | null }[];
  };
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  children?: { name: string; birthDate?: string | null }[];
}

export const authApi = {
  async registerWithAvatar(data: RegisterData, avatarFile?: File) {
    if (!avatarFile) {
      // Если нет аватара, регистрируемся обычным способом
      return this.register(data);
    }

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('fullName', data.fullName);
    if (data.phone) {
      formData.append('phone', data.phone);
    }
    formData.append('avatar', avatarFile);

    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async login(data: LoginData) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },

  async logout(refreshToken: string) {
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },

  async getCurrentUser() {
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    return response.json();
  },

  async updateProfile(data: UpdateProfileData) {
    const response = await fetch(`${API_URL}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async uploadAvatar(avatarFile: File) {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("Нет токена авторизации");
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await fetch(`${API_URL}/me/avatar`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    return response.json();
  },

  async deleteAvatar() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("Нет токена авторизации");
    }

    const response = await fetch(`${API_URL}/me/avatar`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },
};