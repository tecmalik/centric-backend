export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SENDER' | 'TRAVELER';
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  save(): Promise<any>;
  toJSON(): any;
}
