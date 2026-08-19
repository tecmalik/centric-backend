import bcrypt from 'bcryptjs';
import { createModel } from '../../db/model';
import { IUser } from './user.interface';

export const User = createModel<IUser>({
  name: 'User',
  table: 'users',
  dates: ['createdAt', 'updatedAt'],
  hidden: ['password'],
  beforeCreate: async (data) => {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
  },
  methods: {
    async comparePassword(this: any, password: string): Promise<boolean> {
      const hashed = this._hidden?.password;
      if (!hashed) return false;
      return bcrypt.compare(password, hashed);
    },
  },
});
