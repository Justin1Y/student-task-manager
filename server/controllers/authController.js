const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

function buildAuthResponse(user) {
    const token = jwt.sign(
        {
            userId: String(user._id),
            tenantId: String(user.tenantId)
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        success: true,
        token,
        user: {
            id: String(user._id),
            account: user.account,
            name: user.name,
            tenantId: String(user.tenantId)
        }
    };
}

async function register(req, res) {
    try {
        const { tenantName, account, name, password } = req.body;

        if (!tenantName || !account || !name || !password) {
            return res.status(400).json({
                success: false,
                message: "tenantName, account, name, and password are required."
            });
        }

        const existingUser = await User.findOne({ account: account.trim() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Account already exists."
            });
        }

        const tenant = await Tenant.create({
            name: tenantName.trim()
        });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            account: account.trim(),
            name: name.trim(),
            passwordHash,
            tenantId: tenant._id
        });

        return res.status(201).json(buildAuthResponse(user));
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to register user."
        });
    }
}

async function login(req, res) {
    try {
        const { account, password } = req.body;

        if (!account || !password) {
            return res.status(400).json({
                success: false,
                message: "account and password are required."
            });
        }

        const user = await User.findOne({ account: account.trim() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        return res.json(buildAuthResponse(user));
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to log in."
        });
    }
}

async function me(req, res) {
    return res.json({
        success: true,
        user: req.user
    });
}

module.exports = {
    register,
    login,
    me
};
