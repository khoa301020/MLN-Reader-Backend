import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const adminValidation = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.unauth({ message: "Invalid token" });
  }

  if (decoded.role !== "admin")
    return res.error({ message: "Permission denied" });

  const user = await User.findOne({ id: decoded.id, token: token }).select(
    "id name avatar role"
  );

  if (!user) return res.error({ message: "User not found" });

  res.locals.user = user;
  next();
};
export default adminValidation;
