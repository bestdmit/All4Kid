import { Layout, Button, Typography } from "antd";
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
const { Header } = Layout;
import { Link } from 'react-router-dom';
const { Title } = Typography;
import styles from './appHeader.module.css';
import { useAuth } from "../../hooks/useAuth";
import { useState } from 'react';
function AppHeader() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const toggleMobile = () => setIsMobileOpen(prev => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  
  return (
    <Header className={styles.header}>
      <Title className={styles.title}>All4Kid</Title>
      <Button
        className={styles.burgerButton}
        type="text"
        icon={isMobileOpen ? <CloseOutlined /> : <MenuOutlined />}
        onClick={toggleMobile}
      />
      <div className={`${styles.buttonBlock} ${isMobileOpen ? styles.open : ''}`}>
        <Button type="text" size="large" onClick={closeMobile}>
          <Link to="/">Главная</Link>
        </Button>
        <Button type="text" size="large" onClick={closeMobile}>
          <Link to="/create">Создать</Link>
        </Button>
        <Button type="text" size="large" onClick={closeMobile}>
          <Link to="/specialists">Специалисты</Link>
        </Button>
        {isAuthenticated && user ? (
          <Button type="text" size="large" onClick={closeMobile}>
            <Link to="/profile">Профиль</Link>
          </Button>
        ) : (
          <Button type="text" size="large" onClick={closeMobile}>
            <Link to="/auth">Вход</Link>
          </Button>
        )}
      </div>
    </Header>
  );
}

export default AppHeader;