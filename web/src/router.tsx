import { createBrowserRouter } from "react-router-dom";

import { Root } from "./Root";
import { Board } from "./routes/Board";
import { Catalogue } from "./routes/Catalogue";
import { Thread } from "./routes/Thread";



export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "boards/:board",
        element: <Board />,
        children: [
          {
            path: "catalogue",
            element: <Catalogue  />
          },
          {
            path: "thread/:thread",
            element: <Thread />
          }
        ]
      },

    ]
  }
])


