import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { Suspense } from "react";
import { Spinner, Center } from "@chakra-ui/react";
import DefaultLayout from "./layouts";

function App() {
  const routing = useRoutes(routes);

  return (
    <DefaultLayout>
      <Suspense
        fallback={
          <Center h="80vh">
            <Spinner size="xl" />
          </Center>
        }
      >
        {routing}
      </Suspense>
    </DefaultLayout>
  );
}

export default App;
