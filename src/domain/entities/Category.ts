// model Category {
//     id    Int    @id @default(autoincrement())
//     name  String @unique
//     price Float
//     ads   Ad[]
//   }
export interface Category {
    id?: number;
    name: string;
    price: number;
}