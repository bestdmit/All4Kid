import React, { useEffect, useState } from "react";
import { Tabs, message } from "antd";
import AppHeader from "../src/Header/AppHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../src/LoginForm"
import RegisterForm from "../src/RegisterForm";

const tabStyle: React.CSSProperties = {
  maxWidth: "400px",
  margin: "0 auto",
};

function AuthorizationPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Редирект если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // Показываем ошибки
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  const items = [
    {
      key: "login",
      label: "Вход",
      children: (
        <LoginForm
          isLoading={isLoading}
          onTabChange={() => setActiveTab("register")}
        />
      ),
    },
    {
      key: "register",
      label: "Регистрация",
      children: (
        <RegisterForm
          isLoading={isLoading}
          onTabChange={() => setActiveTab("login")}
        />
      ),
    },
  ];

  return (
    <>
      <AppHeader />
      <div style={tabStyle}>
        <Tabs
          activeKey={activeTab}
          items={items}
          onChange={setActiveTab}
          centered
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        />
      </div>
    </>
  );
}

export default AuthorizationPage;