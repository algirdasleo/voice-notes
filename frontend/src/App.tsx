import { Container, Flex } from "@radix-ui/themes";
import { ThemeToggle } from "./components/ThemeToggle";
import "./App.css";

function App() {
  return (
    <Flex justify="center">
      <Container size="2" width="580px">
        <Flex justify="between" align="center" py="4">
          <h1>Voice Notes App</h1>
          <ThemeToggle />
        </Flex>
      </Container>
    </Flex>
  );
}

export default App;
