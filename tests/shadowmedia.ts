import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Shadowmedia } from "../target/types/shadowmedia";
import * as assert from "assert";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  Connection,
} from "@solana/web3.js";

describe("shadowmedia", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Shadowmedia as Program<Shadowmedia>;
  var driveAccount;
  var channelAccount1;
  var channelAccount2 = Keypair.generate();
  var sysowner = new anchor.web3.Keypair.generate();
  var user = anchor.web3.Keypair.generate();

  it("can store a new username", async () => {
    let { wallet } = program.provider;
    let tx = await program.rpc.storeName(
      "svenasol",
      {
        accounts: {
          user: user.publicKey,
          author: wallet.publicKey,
          sysowner: sysowner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [user, wallet.payer],
      }
    );
    //console.log(tx)
    //console.log(program.account)

    // Fetch the account details of the created video.
    const userAccount = await program.account.username.fetch(
      user.publicKey
    );

    // Ensure it has the right data.
    assert.equal(
      userAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    assert.equal(userAccount.name, "svenasol");
    assert.equal(userAccount.verified, false);
    assert.ok(userAccount.timestamp);

    const usernames = await program.account.username.all();
    usernames.forEach(u=>{
      console.log(u.publicKey.toBase58(), u.account.name, u.account.verified)
    })

  });
  it("can approve a new username", async () => {
    let { wallet } = program.provider;
    try{
    let tx = await program.rpc.approveUsername(
      {
        accounts: {
          user: user.publicKey,
          author: wallet.publicKey,
          sysowner: sysowner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [sysowner, wallet.payer],
      }
    );
    console.log(tx)
    }catch(e){
      console.error(e)
    }
    //console.log(program.account)

    // Fetch the account details of the created video.
    const userAccount = await program.account.username.fetch(
      user.publicKey
    );

    // Ensure it has the right data.
    assert.equal(userAccount.name, "svenasol");

    const usernames = await program.account.username.all();
    usernames.forEach(u=>{
      console.log(u.publicKey.toBase58(), u.account.name, u.account.verified)
    })
  });


  xit("can store a new channel", async () => {
    const channel = anchor.web3.Keypair.generate();
    let { wallet } = program.provider;
    await program.rpc.storeChannel(
      "Project Disclosure",
      "A very long description of the channel that says a lot about what we're trying to achieve", //content
      "channel.jpg", //img
      {
        accounts: {
          channel: channel.publicKey,
          author: wallet.publicKey,
          drive: driveAccount.publicKey,
          sysowner: sysowner,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [channel, wallet.payer],
      }
    );

    // Fetch the account details of the created video.
    const channelAccount = await program.account.channel.fetch(
      channel.publicKey
    );

    channelAccount1 = channel;
    // Ensure it has the right data.
    assert.equal(
      channelAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    assert.equal(channelAccount.topic, "Project Disclosure");
    assert.equal(
      channelAccount.desc,
      "A very long description of the channel that says a lot about what we're trying to achieve"
    );
    assert.equal(channelAccount.img, "channel.jpg");
    assert.ok(channelAccount.timestamp);
  });

  xit("can store a new video", async () => {
    const video = anchor.web3.Keypair.generate();
    let { wallet } = program.provider;
    await program.rpc.storeVideo(
      "Moment of contact", //topic
      "Description of video", //content
      "thumb.jpg", //img
      "video.mp4", //file
      "",
      {
        accounts: {
          video: video.publicKey,
          author: wallet.publicKey,
          drive: driveAccount.publicKey,
          channel: channelAccount1.publicKey,
          sysowner: sysowner,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [video, wallet.payer],
      }
    );

    // Fetch the account details of the created video.
    const videoAccount = await program.account.video.fetch(video.publicKey);

    // Ensure it has the right data.
    assert.equal(
      videoAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    assert.equal(videoAccount.topic, "Moment of contact");
    assert.equal(videoAccount.content, "Description of video");
    assert.equal(videoAccount.file, "video.mp4");
    assert.ok(videoAccount.timestamp);
  });

  xit("can store a new video with a different channel", async () => {
    const video = anchor.web3.Keypair.generate();
    await program.rpc.storeVideo(
      "Spray DESO in my mouth", //topic
      "Long description of video", //content
      "desothumb.jpg", //img
      "desovideo.mp4", //file
      "enc.key",
      {
        accounts: {
          video: video.publicKey,
          author: program.provider.wallet.publicKey,
          drive: driveAccount.publicKey,
          channel: channelAccount2.publicKey,
          sysowner: sysowner,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [video],
      }
    );

    // Fetch the account details of the created video.
    const videoAccount = await program.account.video.fetch(video.publicKey);

    // Ensure it has the right data.
    assert.equal(
      videoAccount.author.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    assert.equal(videoAccount.topic, "Spray DESO in my mouth");
    assert.equal(videoAccount.content, "Long description of video");
    assert.equal(videoAccount.file, "desovideo.mp4");
    assert.ok(videoAccount.timestamp);
  });

  xit("cannot store video with missing fields", async () => {
    try {
      let drive = Keypair.generate();
      const video = anchor.web3.Keypair.generate();
      await program.rpc.storeVideo(
        "", //topic
        "Description of video", //content
        "thumb.jpg", //img
        "video.mp4", //file
	"",
        {
          accounts: {
            video: video.publicKey,
            author: program.provider.wallet.publicKey,
            drive: driveAccount.publicKey,
            channel: channelAccount1.publicKey,
            sysowner: sysowner,
            systemProgram: anchor.web3.SystemProgram.programId,
          },
          signers: [video],
        }
      );
    } catch ({ error }) {
      assert.equal(error.errorCode.code, "TopicTooShort");
      return;
    }
  });

  xit("can fetch all videos", async () => {
    const videoAccounts = await program.account.video.all();
    assert.equal(videoAccounts.length, 2);
  });

  xit("can filter videos by author", async () => {
    const authorPublicKey = program.provider.wallet.publicKey;
    const videoAccounts = await program.account.video.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: authorPublicKey.toBase58(),
        },
      },
    ]);

    assert.equal(videoAccounts.length, 2);
    assert.ok(
      videoAccounts.every((videoAccount) => {
        return (
          videoAccount.account.author.toBase58() === authorPublicKey.toBase58()
        );
      })
    );
  });

  xit("can filter videos by channel", async () => {
    const authorPublicKey = program.provider.wallet.publicKey;
    const videoAccounts = await program.account.video.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: channelAccount1.publicKey.toBase58(),
        },
      },
    ]);

    assert.equal(videoAccounts.length, 1);
    assert.ok(
      videoAccounts.every((videoAccount) => {
        return (
          videoAccount.account.channel.toBase58() ===
          channelAccount1.publicKey.toBase58()
        );
      })
    );
  });
});
