import bcrypt from 'bcryptjs';
import { createModel } from '../../db/model';
import { IUser } from './user.interface';

export const User = createModel({
  table: 'users',
  dates: ['createdAt', 'updatedAt'],
  hidden: ['password'],
  beforeCreate: async (doc: any) => {
    if (doc.password) {
      doc.password = await bcrypt.hash(doc.password, 10);
    }
    return doc;
  },
  methods: {
    async comparePassword(this: IUser & Record<string, any>, password: string): Promise<boolean> {
      if (!this.password) return false;
      return bcrypt.compare(password, this.password);
    },
  },
});