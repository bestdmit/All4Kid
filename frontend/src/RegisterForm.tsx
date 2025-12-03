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
  const { register } = useAuth();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
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