import React, { useEffect,useState } from "react";
import type { FormProps } from "antd";
import { Button, Checkbox, Form, Input, Tabs, message } from "antd";
import AppHeader from "./Header/AppHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type FieldType = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  phone?: string;
  remember?: boolean;
};

const contentStyle: React.CSSProperties = {
  maxWidth: "400px",
  margin: "40px auto",
  padding: "30px",
  border: "1px solid #d9d9d9",
  borderRadius: "8px",
  backgroundColor: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const tabStyle: React.CSSProperties = {
  maxWidth: "400px",
  margin: "0 auto",
};

function AuthorizationPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, login, register, clearError } = useAuth();

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

  const onLoginFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      await login({
        email: values.email!,
        password: values.password!,
      });
      message.success("Вход выполнен успешно!");
    } catch (err) {
      // Ошибка уже обработана в сторе
    }
  };

  const onRegisterFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error("Пароли не совпадают");
        return;
      }

      await register({
        email: values.email!,
        password: values.password!,
        fullName: values.fullName!,
        phone: values.phone,
      });
      message.success("Регистрация успешна! Добро пожаловать!");
    } catch (err) {
      // Ошибка уже обработана в сторе
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Пожалуйста, заполните все обязательные поля правильно");
  };

  const items = [
    {
      key: "login",
      label: "Вход",
      children: (
        <Form
          form={form}
          name="login"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onLoginFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Пожалуйста, введите ваш email!" },
              { type: "email", message: "Введите корректный email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Пожалуйста, введите ваш пароль!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldType>
            name="remember"
            valuePropName="checked"
          >
            <Checkbox>Запомнить меня</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading} 
              block
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "register",
      label: "Регистрация",
      children: (
        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onRegisterFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          scrollToFirstError
        >
          <Form.Item<FieldType>
            label="Полное имя"
            name="fullName"
            rules={[{ required: true, message: "Пожалуйста, введите ваше имя!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Пожалуйста, введите ваш email!" },
              { type: "email", message: "Введите корректный email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Телефон"
            name="phone"
            rules={[
              { pattern: /^[\d+\-\s()]+$/, message: "Введите корректный номер телефона" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: "Пожалуйста, введите пароль!" },
              { min: 6, message: "Пароль должен быть не менее 6 символов!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldType>
            label="Подтвердите пароль"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Пожалуйста, подтвердите пароль!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Пароли не совпадают!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading} 
              block
            >
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>
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