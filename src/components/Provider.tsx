import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./Theme";

import type { PropsWithChildren } from "react";

function Provider({ children }: PropsWithChildren<{}>) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {children}
    </ChakraProvider>
  );
}

export default Provider;
