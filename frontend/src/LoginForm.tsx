import React from "react";
import type { FormProps } from "antd";
import { Button, Checkbox, Form, Input, message } from "antd";
import { useAuth } from "../hooks/useAuth";

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

type LoginFormProps = {
  isLoading: boolean;
  onTabChange?: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ isLoading, onTabChange }) => {
  const [form] = Form.useForm();
  const { isAuthenticated, login } = useAuth();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      await login({
        email: values.email!,
        password: values.password!,
      });
      
      if(isAuthenticated) message.success("Вход выполнен успешно!");
      
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
      name="login"
      layout="vertical"
      initialValues={{ remember: true }}
      onFinish={onFinish}
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

      {onTabChange && (
        <Form.Item style={{ textAlign: "center", marginBottom: 0 }}>
          <Button type="link" onClick={onTabChange}>
            Нет аккаунта? Зарегистрироваться
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default LoginForm;