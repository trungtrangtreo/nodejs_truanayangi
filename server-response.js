module.exports = {
    response
}

function response(success,message)
{
    return {success:success,message:message};
}