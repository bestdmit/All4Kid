// import { useState } from 'react'
// import React from "react";
// import { Form, Input, InputNumber, Button, Card, message, Space, Typography } from "antd";


// export interface CreateSpecialistDto {
//   name: string;
//   specialty: string;
//   experience?: number;
//   rating?: number;
//   location: string;
//   price_per_hour?: number;
// }

// export interface Specialist extends CreateSpecialistDto {
//   id: number;
//   created_at?: string;
// }

// export interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   message?: string;
//   total?: number;
// }

// // API функция
// const API_BASE_URL = 'http://localhost:5000/api';

// export const createSpecialist = async (
//   specialistData: CreateSpecialistDto
// ): Promise<ApiResponse<Specialist>> => {
//   try {
//     console.log('📤 Отправляю POST запрос на:', `${API_BASE_URL}/specialists`);
//     console.log('📦 Данные для отправки:', specialistData);
    
//     const response = await fetch(`${API_BASE_URL}/specialists`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(specialistData),
//     });

//     console.log('📥 Ответ получен. Status:', response.status, response.statusText);
    
//     // Проверяем, есть ли тело ответа
//     const responseText = await response.text();
//     console.log('📄 Тело ответа (сырое):', responseText);
    
//     let result: ApiResponse<Specialist>;
//     try {
//       result = JSON.parse(responseText);
//     } catch (parseError) {
//       console.error('❌ Ошибка парсинга JSON:', parseError);
//       throw new Error(`Невалидный JSON ответ: ${responseText}`);
//     }

//     console.log('✅ Парсинг JSON успешен:', result);

//     if (!response.ok) {
//       throw new Error(result.message || `HTTP error! status: ${response.status}`);
//     }

//     return result;
//   } catch (error) {
//     console.error('💥 Полная ошибка при создании специалиста:', error);
//     throw error;
//   }
// };

// const { Title } = Typography;

// export default function NewAdvertisements() {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (values: CreateSpecialistDto) => {
//     setLoading(true);
    
//     try {
//       const result = await createSpecialist(values);
      
//       if (result.success) {
//         message.success('Специалист успешно создан!');
//         form.resetFields();
//       } else {
//         message.error(result.message || 'Ошибка при создании специалиста');
//       }
//     } catch (error) {
//       console.error('Ошибка при создании специалиста:', error);
//       message.error('Произошла ошибка при создании специалиста');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     form.resetFields();
//   };

//   return (
//     <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
//       <Card>
//         <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
//           Добавить нового специалиста
//         </Title>
        
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           disabled={loading}
//           size="large"
//         >
//           {/* Основная информация */}
//           <div style={{ marginBottom: 24 }}>
//             <Title level={4}>Основная информация</Title>
            
//             <Form.Item
//               label="Имя специалиста"
//               name="name"
//               rules={[
//                 { required: true, message: 'Пожалуйста, введите имя специалиста' },
//                 { min: 2, message: 'Имя должно содержать минимум 2 символа' }
//               ]}
//             >
//               <Input 
//                 placeholder="Введите полное имя специалиста" 
//                 allowClear
//               />
//             </Form.Item>

//             <Form.Item
//               label="Специальность"
//               name="specialty"
//               rules={[
//                 { required: true, message: 'Пожалуйста, введите специальность' },
//                 { min: 2, message: 'Специальность должна содержать минимум 2 символа' }
//               ]}
//             >
//               <Input 
//                 placeholder="Например: Логопед, Психолог, Дефектолог" 
//                 allowClear
//               />
//             </Form.Item>

//             <Form.Item
//               label="Местоположение"
//               name="location"
//               rules={[
//                 { required: true, message: 'Пожалуйста, введите местоположение' },
//                 { min: 2, message: 'Местоположение должно содержать минимум 2 символа' }
//               ]}
//             >
//               <Input 
//                 placeholder="Город или район оказания услуг" 
//                 allowClear
//               />
//             </Form.Item>
//           </div>

//           {/* Дополнительная информация */}
//           <div style={{ marginBottom: 24 }}>
//             <Title level={4}>Дополнительная информация</Title>
            
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
//               <Form.Item
//                 label="Опыт работы (лет)"
//                 name="experience"
//                 rules={[
//                   { type: 'number', min: 0, max: 50, message: 'Опыт должен быть от 0 до 50 лет' }
//                 ]}
//               >
//                 <InputNumber 
//                   min={0}
//                   max={50}
//                   placeholder="0"
//                   style={{ width: '100%' }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Рейтинг"
//                 name="rating"
//                 rules={[
//                   { type: 'number', min: 0, max: 5, message: 'Рейтинг должен быть от 0 до 5' }
//                 ]}
//               >
//                 <InputNumber 
//                   min={0}
//                   max={5}
//                   step={0.1}
//                   placeholder="0.0"
//                   style={{ width: '100%' }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 label="Цена за час (₽)"
//                 name="price_per_hour"
//                 rules={[
//                   { type: 'number', min: 0, message: 'Цена не может быть отрицательной' }
//                 ]}
//               >
//                 <InputNumber 
//                   min={0}
//                   placeholder="0"
//                   style={{ width: '100%' }}
//                 />
//               </Form.Item>
//             </div>
//           </div>

//           {/* Кнопки действий */}
//           <Form.Item>
//             <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 loading={loading}
//                 size="large"
//                 style={{ minWidth: 120 }}
//               >
//                 {loading ? 'Создание...' : 'Создать'}
//               </Button>
              
//               <Button 
//                 htmlType="button" 
//                 onClick={handleReset}
//                 size="large"
//                 disabled={loading}
//               >
//                 Очистить
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// }