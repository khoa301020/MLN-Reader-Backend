import jwt from "jsonwebtoken";
import { SystemStatus } from "../models/common.model.js";
import { Manga } from "../models/manga.model.js";
import { Novel } from "../models/novel.model.js";
import User from "../models/user.model.js";

const GetAll = async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
};

const Register = (req, res) => {
  SystemStatus.findOne({}).exec(function (err, systemStatus) {
    if (err) return res.error({ message: "Error occured", errors: err });
    if (!systemStatus) return res.error({ message: "System status not found" });

    systemStatus.lastUserId += 1;

    const prefix = "user_";

    User.findOne(
      {
        $or: [{ email: req.body.email }, { name: req.body.name }],
      },
      (err, user) => {
        if (err) return res.error({ message: "Error occured", errors: err });
        if (user)
          return res.error({
            message: "Username or email already exists",
            errors: err,
          });

        const newUser = new User({
          id: prefix + systemStatus.lastUserId,
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
        });

        newUser.save((err) => {
          if (err) {
            return res.error({ message: "Error occured", errors: err });
          } else {
            systemStatus.save(function (err) {
              if (err)
                return res.error({ message: "Error occured", errors: err });
              return res.success({
                message: "User created!",
              });
            });
          }
        });
      }
    );
  });
};

const Login = (req, res) => {
  User.findOne(
    {
      $or: [{ email: req.body.query }, { name: req.body.query }],
    },
    async (err, user) => {
      if (err) return res.error({ message: "Error occured", errors: err });
      if (!user) return res.unauth({ message: "User not found" });
      if (user.accountStatus.status === "disabled")
        return res.unauth({ message: "User has been disabled" });

      const checkValidPassword = await user.isValidPassword(req.body.password);
      if (!checkValidPassword)
        return res.unauth({ message: "Invalid password" });

      const token = await user.generateToken();

      res.cookie("token", token, {
        httpOnly: false,
        withCredentials: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        sameSite: "none",
        secure: true,
      });

      return res.success({
        message: "User logged in",
        result: {
          token,
          username: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      });
    }
  );
};

const Logout = (req, res) => {
  const username = req.body.username;

  User.findOne({ name: username }, (err, user) => {
    if (err) return res.internal({ message: "Error occured", errors: err });
    if (!user) return res.unauth({ message: "User not found" });

    user.token = null;
    user.save((err) => {
      if (err) return res.internal({ message: "Error occured", errors: err });

      res.success({
        message: "User logged out",
      });
    });
  });
};

const Verify = (req, res) => {
  const username = req.body.username;
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findOne(
      { id: decoded.id, token: token, "accountStatus.status": "active" },
      (err, user) => {
        if (err) return res.internal({ message: "Error occured", errors: err });
        if (!user) return res.unauth({ message: "User not found" });
        if (user.name !== username)
          return res.unauth({ message: "Wrong user" });

        res.success({
          message: "User verified",
          result: {
            username: user.name,
            role: user.role,
            avatar: user.avatar,
          },
        });
      }
    );
  } catch (error) {
    return res.unauth({ message: "Invalid token" });
  }
};

const BookVerify = (req, res) => {
  const { id, username } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  if (!id || !username || !token)
    return res.unauth({ message: "Invalid request" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findOne({ id: decoded.id, token: token }, (err, user) => {
      if (err) return res.internal({ message: "Error occured", errors: err });
      if (!user) return res.unauth({ message: "User not found" });
      if (user.name !== username) return res.unauth({ message: "Wrong user" });

      let find;
      if (id.includes("novel")) {
        find = Novel.findOne({ id }).select("uploader");
      } else if (id.includes("manga")) {
        find = Manga.findOne({ id }).select("uploader");
      }

      find.exec((err, book) => {
        if (err) return res.internal({ message: "Error occured", errors: err });
        if (!book) return res.error({ message: "Book not found" });

        if (book.uploader !== user.name)
          return res.success({ message: "Failed" });

        res.success({
          message: "Succeed",
          result: {
            username: user.name,
            role: user.role,
          },
        });
      });
    });
  } catch (error) {
    return res.unauth({ message: "Invalid token" });
  }
};

// Export
export { GetAll, Register, Login, Verify, BookVerify, Logout };
