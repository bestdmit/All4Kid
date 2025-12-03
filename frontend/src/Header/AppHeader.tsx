import { Layout, Button,Typography  } from "antd";
const { Header } = Layout;
import { Link } from 'react-router-dom';
const {Title} = Typography;
import styles from './appHeader.module.css';
import { useAuth } from "../../hooks/useAuth";
function AppHeader() {
  const { user, isAuthenticated} = useAuth();
  
  return (
    <Header className={styles.header}>
      <Title className={styles.title}>All4Kid</Title>
      <div className={styles.buttonBlock}>
      <Button  type="text" size="large">
        <Link to="/">Главная</Link>
      </Button>
      <Button type="text" size="large">
        <Link to="/create">Создать</Link>
      </Button>
      <Button type="text" size="large">
        <Link to="/specialists">Специалисты</Link>
      </Button>
      {isAuthenticated && user ? 
        (<Button type="text" size="large">
          <Link to="/profile">Профиль</Link>
          </Button>):
        <Button type="text" size="large">
          <Link to="/auth">Вход</Link>
        </Button>
      }
      </div>
    </Header>
  );
}

export default AppHeader;