import { app } from 'router-api/src/app'

type PagesFunctionContext = {
  request: Request
}

export const onRequest = ({ request }: PagesFunctionContext) => app.fetch(request)
