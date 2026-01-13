import React from "react";
import type { FormProps } from "antd";
import { Button, Form, Input, message } from "antd";
import { useAuth } from "../hooks/useAuth";

type FieldType = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  phone?: string;
};

type RegisterFormProps = {
  isLoading: boolean;
  onTabChange?: () => void;
};

const RegisterForm: React.FC<RegisterFormProps> = ({ isLoading, onTabChange }) => {
  const [form] = Form.useForm();
  const { isAuthenticated, register } = useAuth();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (values.fullName) {
      values.fullName = values.fullName.trim().replace(/\s{2,}/g, ' ');
    }
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
      if (isAuthenticated) message.success("Регистрация успешна! Добро пожаловать!");
    } catch (err) {
      // Ошибка уже обработана в сторе
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Пожалуйста, заполните все обязательные поля правильно");
  };

  // Регулярное выражение для email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Регулярное выражение для проверки кириллицы
  const cyrillicRegex = /^[\sа-яА-ЯёЁ\-]+$/;
  
  // Регулярное выражение для телефона (более строгое)
  const phoneRegex = /^[\d\s\-+()]{10,15}$/;

  return (
    <Form
      form={form}
      name="register"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      scrollToFirstError
    >
      <Form.Item<FieldType>
        label="Полное имя"
        name="fullName"
        rules={[
          { required: true, message: "Пожалуйста, введите ваше имя!" },
          { 
            pattern: cyrillicRegex, 
            message: "Имя должно содержать только кириллицу, пробелы и дефисы!" 
          },
          { 
            min: 2, 
            message: "Имя должно быть не менее 2 символов!" 
          },
          { 
            max: 50, 
            message: "Имя должно быть не более 50 символов!" 
          },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              
              // Проверка, что имя содержит хотя бы одну букву (не только пробелы)
              const hasLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(value);
              if (!hasLetters) {
                return Promise.reject(new Error("Имя должно содержать буквы!"));
              }
              
              // Проверка, что нет множественных пробелов подряд
              if (/\s{2,}/.test(value)) {
                return Promise.reject(new Error("Не используйте несколько пробелов подряд!"));
              }
              
              return Promise.resolve();
            },
          }
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Пожалуйста, введите ваш email!" },
          { pattern: emailRegex, message: "Введите корректный email!" },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="Телефон"
        name="phone"
        rules={[
          { pattern: phoneRegex, message: "Введите корректный номер телефона" },
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

      {onTabChange && (
        <Form.Item style={{ textAlign: "center", marginBottom: 0 }}>
          <Button type="link" onClick={onTabChange}>
            Уже есть аккаунт? Войти
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default RegisterForm;