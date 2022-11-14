use anchor_lang::prelude::*;

declare_id!("ESfupR6JYGqkYE99f611KvK8e8DCUKRXh9i3tkgcoaW1");

pub mod util {
    use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

    pub fn lamport_to_sol(lamports: u64) -> f64 {
        lamports as f64 / LAMPORTS_PER_SOL as f64
    }
}

const SYS_PUBKEY: &str = "3CAj6MK8HxyNNBQQDcAoqH3Avsm6QYAo7WiUUrN7y7nE";

#[program]
pub mod shadowmedia {
    use super::*;
    use anchor_lang::solana_program::system_instruction::transfer as solana_transfer;
   
    pub fn approve_username(
        ctx: Context<ApproveName>,
    ) -> Result<()> {
        let user: &mut Account<Username> = &mut ctx.accounts.user;
        user.verified = true;
        Ok(())
    }

    pub fn store_name(
        ctx: Context<StoreName>,
        name: String,
    ) -> Result<()> {
        let lamports: u64 = 50_000_000;
        let ix = solana_transfer(
            &ctx.accounts.author.key(),
            &ctx.accounts.sysowner.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.author.to_account_info(),
                ctx.accounts.sysowner.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )
        .unwrap();

        let user: &mut Account<Username> = &mut ctx.accounts.user;
        let author: &mut Signer = &mut ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if name.chars().count() > 12 {
            return Err(ErrorCode::UsernameTooLong.into());
        }
        if name.chars().count() < 4 {
            return Err(ErrorCode::UsernameTooShort.into());
        }
        user.author = *author.key;
        user.timestamp = clock.unix_timestamp;
        user.name = name;
        user.verified = false;

        Ok(())
    }

}


#[derive(Accounts)]
pub struct StoreName<'info> {
    #[account(init, payer = author, space = Username::LEN)]
    pub user: Account<'info, Username>,
    #[account(mut)]
    pub author: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(
        mut, address = SYS_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub sysowner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct ApproveName<'info> {
    #[account(mut)]
    pub user: Account<'info, Username>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(
        mut, address = SYS_PUBKEY.parse::<Pubkey>().unwrap(),
    )]
    pub sysowner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Username {
    pub user: Pubkey,
    pub author: Pubkey,
    pub sysowner: Pubkey,
    pub timestamp: i64,
    pub name: String,
    pub verified: bool
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const TIMESTAMP_LENGTH: usize = 8;
const MAX_USERNAME_LENGTH: usize = 12 * 4; 

impl Username{
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // User
        + PUBLIC_KEY_LENGTH // Author
        + TIMESTAMP_LENGTH // Timestamp
        + STRING_LENGTH_PREFIX + MAX_USERNAME_LENGTH; // Username.
}


#[error_code]
pub enum ErrorCode {
    #[msg("The provided username is too long.")]
    UsernameTooLong,
    #[msg("The provided username is too short.")]
    UsernameTooShort,
}
