import { AppDataSource } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import bcrypt from 'bcrypt';
import { User } from '../entities/User.js';
import { Team } from '../entities/Team.js';
import { Role } from '../entities/Role.js';
export class AccountService {
    private accountRepo = AppDataSource.getRepository(Account);
    private userRepo = AppDataSource.getRepository(User);
    private roleRepo = AppDataSource.getRepository(Role);
    async getAllAccounts() {
        const accounts = await this.accountRepo.find({
            where: { isDeleted: false },
            relations: { role: true },
            select: {
                accId: true,
                username: true,
                createdAt: true,
                role: { roleName: true }
            }
        });
        return accounts.map(acc => {
            const formattedDate = acc.createdAt
                ? new Date(acc.createdAt).toISOString().replace('T', ' ').split('.')[0]
                : null;
            return {
        
                accId: acc.accId,
                username: acc.username,
                createdAt: formattedDate,
                roleName: acc.role?.roleName
            }
        });
}
    
    async getAccountInfo(id: number) {
        const account = await this.accountRepo.findOne({
            where: { 
                accId: id, 
                isDeleted: false 
            },
        });

        if (!account) {
            throw new Error('Account not found or has been deleted');
        }

        return account;
    }

    async createAccount(data: any) {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
        //Check if username already exists
            const existing = await this.accountRepo.findOne({ where: { username: data.username } });
            
        if (existing) throw new Error('Username already exists');
 
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const role = await transactionalEntityManager.findOneBy('Role', { roleId: 2 });
            if (!role) throw new Error(`Role not found`);
            
        const newAccount = this.accountRepo.create({
            username: data.username,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            role: role, 
            isDeleted: false
        });
            const savedAccount = await transactionalEntityManager.save(newAccount);
            
        const team = await transactionalEntityManager.findOneBy(Team, { teamId: data.teamId });
        if (!team) throw new Error(`Team with ID ${data.teamId} not found`);
        
        const newUser = this.userRepo.create({
            fullName: data.fullname,
            mssv: data.mssv,
            class: data.class,
            email: data.email,
            phoneNumber: data.phoneNumber,
            team: team,
            account: savedAccount 
        });
    
        return await transactionalEntityManager.save(newUser);
    });
}

    async updateAccount(id: number, data: any) {
    const account = await this.accountRepo.findOne({
        where: { accId: id },
        relations: { role: true }
    });

    if (!account) throw new Error('Account not found');

    if (data.password) {
        account.password = await bcrypt.hash(data.password, 10);
    }

    if (data.roleId) {
        const role = await this.roleRepo.findOneBy({ roleName: data.roleId });
        if (!role) throw new Error(`Role not found`);
        account.role = role;
    }
        account.updatedAt = new Date().toISOString().replace('T', ' ').split('.')[0];
    const savedAccount = await this.accountRepo.save(account);

    return {
        accId: savedAccount.accId,
        username: savedAccount.username,
        createdAt: savedAccount.createdAt,
        updatedAt: savedAccount.updatedAt,
        roleName: savedAccount.role?.roleName
    };
}

    async softDeleteAccount(id: number) {
        const account = await this.accountRepo.findOneBy({ accId: id });
        if (!account) throw new Error('Account not found');

        account.isDeleted = true; 
        return await this.accountRepo.save(account);
    }
}